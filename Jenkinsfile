pipeline {
    agent any

    options {
        gitLabConnection('A505')
    }

    environment {
        // [필수 수정] 본인의 Docker Hub ID를 입력하세요
        DOCKER_USER = "rasitnp" 
        DOCKER_REPO = "${DOCKER_USER}/jupasu"
        DOCKER_CRED_ID = "docker-hub-credentials"
        
        // 운영 서버 정보
        PROD_SERVER_IP = "13.124.55.70"
        PROD_SERVER_USER = "ubuntu"
        SSH_CRED_ID = "ssh-agent-key"
        GIT_CRED_ID = "gitlab-access-token"
        
        DEV_PATH = "/home/ubuntu/jupasu_dev"
        PROD_PATH = "/home/ubuntu/jupasu_prod"
        
        // GitLab 저장소 주소 (HTTPS 형식)
        REPO_URL = "lab.ssafy.com/s14-bigdata-recom-sub1/S14P21A505.git"
    }

    stages {
        stage('Source Checkout') {
            steps {
                updateGitlabCommitStatus name: 'Jenkins/Build', state: 'running'
                checkout scm
            }
        }

        stage('Build & Push Images') {
            steps {
                script {
                    def tag = (env.GIT_BRANCH == 'origin/master') ? "latest" : "dev"
                    
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CRED_ID}") {
                        echo "Building and Pushing images for branch: ${env.GIT_BRANCH} (Tag: ${tag})"
                        
                        sh "docker build -t ${DOCKER_REPO}:ai-${tag} ./ai"
                        sh "docker push ${DOCKER_REPO}:ai-${tag}"

                        sh "docker build -t ${DOCKER_REPO}:back-${tag} ./back"
                        sh "docker push ${DOCKER_REPO}:back-${tag}"

                        sh "docker build -t ${DOCKER_REPO}:front-${tag} ./front"
                        sh "docker push ${DOCKER_REPO}:front-${tag}"
                    }
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    def isMaster = (env.GIT_BRANCH == 'origin/master')
                    def targetPath = isMaster ? PROD_PATH : DEV_PATH
                    def composeFile = isMaster ? "docker-compose.prod.yml" : "docker-compose.dev.yml"
                    def branchName = isMaster ? "master" : "develop"
                    
                    echo "Deploying to ${isMaster ? 'Production' : 'Development'} server..."

                    // GitLab 자격 증명과 Docker Hub 자격 증명을 각각 올바르게 불러옵니다.
                    withCredentials([
                        usernamePassword(credentialsId: "${GIT_CRED_ID}", passwordVariable: 'GIT_TOKEN', usernameVariable: 'GIT_USER'),
                        usernamePassword(credentialsId: "${DOCKER_CRED_ID}", passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_ID')
                    ]) {
                        sshagent(credentials: ["${SSH_CRED_ID}"]) {
                            sh """
                                ssh -o StrictHostKeyChecking=no ${PROD_SERVER_USER}@${PROD_SERVER_IP} "
                                    cd ${targetPath} &&
                                    git remote set-url origin https://${GIT_USER}:${GIT_TOKEN}@${REPO_URL} &&
                                    git pull origin ${branchName} &&
                                    
                                    # Docker Hub 전용 비밀번호로 로그인
                                    echo '${DOCKER_PASSWORD}' | docker login -u '${DOCKER_ID}' --password-stdin &&
                                    
                                    export DOCKER_USER=${DOCKER_USER} &&
                                    docker compose -f ${composeFile} pull &&
                                    docker compose -f ${composeFile} up -d &&
                                    
                                    docker image prune -f
                                "
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo "작업 종료. 워크스페이스를 정리합니다."
            cleanWs()
        }
        success {
            updateGitlabCommitStatus name: 'Jenkins/Build', state: 'success'
        }
        failure {
            updateGitlabCommitStatus name: 'Jenkins/Build', state: 'failed'
            echo "빌드 또는 배포에 실패했습니다. 로그를 확인하세요."
        }
    }
}
