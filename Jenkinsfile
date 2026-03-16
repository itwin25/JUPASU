pipeline {
    agent any

    environment {
        // [필수 수정] 본인의 Docker Hub ID를 입력하세요
        DOCKER_USER = "your_docker_hub_id" 
        DOCKER_REPO = "${DOCKER_USER}/wine-project"
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
                    // 환경 설정 (브랜치에 따라 태그 분기)
                    def tag = (env.GIT_BRANCH == 'origin/master') ? "latest" : "dev"
                    
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CRED_ID}") {
                        echo "Building and Pushing images for branch: ${env.GIT_BRANCH} (Tag: ${tag})"
                        
                        // 1. AI 서비스 빌드 및 푸시
                        sh "docker build -t ${DOCKER_REPO}:ai-${tag} ./ai"
                        sh "docker push ${DOCKER_REPO}:ai-${tag}"

                        // 2. Backend 서비스 빌드 및 푸시
                        sh "docker build -t ${DOCKER_REPO}:back-${tag} ./back"
                        sh "docker push ${DOCKER_REPO}:back-${tag}"

                        // 3. Frontend 서비스 빌드 및 푸시
                        sh "docker build -t ${DOCKER_REPO}:front-${tag} ./front"
                        sh "docker push ${DOCKER_REPO}:front-${tag}"
                    }
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    // 환경별 변수 설정
                    def isMaster = (env.GIT_BRANCH == 'origin/master')
                    def targetPath = isMaster ? PROD_PATH : DEV_PATH
                    def composeFile = isMaster ? "docker-compose.prod.yml" : "docker-compose.dev.yml"
                    def branchName = isMaster ? "master" : "develop"
                    
                    echo "Deploying to ${isMaster ? 'Production' : 'Development'} server..."

                    withCredentials([usernamePassword(credentialsId: "${GIT_CRED_ID}", 
                                                      passwordVariable: 'GIT_TOKEN', 
                                                      usernameVariable: 'GIT_USER')]) {
                        sshagent(credentials: ["${SSH_CRED_ID}"]) {
                            sh """
                                ssh -o StrictHostKeyChecking=no ${PROD_SERVER_USER}@${PROD_SERVER_IP} "
                                    cd ${targetPath} &&
                                    git remote set-url origin https://${GIT_USER}:${GIT_TOKEN}@${REPO_URL} &&
                                    git pull origin ${branchName} &&
                                    
                                    # Docker Hub 로그인 (비공개 저장소 접근 권한 획득)
                                    echo '${GIT_TOKEN}' | docker login -u '${DOCKER_USER}' --password-stdin &&
                                    
                                    # 이미지 정보 업데이트 후 Pull 및 컨테이너 재시작
                                    export DOCKER_USER=${DOCKER_USER} &&
                                    docker compose -f ${composeFile} pull &&
                                    docker compose -f ${composeFile} up -d &&
                                    
                                    # 사용하지 않는 이전 이미지 정리
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
