pipeline {
    agent any

    options {
        gitLabConnection('A505')
    }

    environment {
        // 운영 서버 정보
        PROD_SERVER_IP = "13.124.55.70"
        PROD_SERVER_USER = "ubuntu"
        SSH_CRED_ID = "ssh-agent-key"
        GIT_CRED_ID = "gitlab-access-token" // Jenkins에 등록한 Username with password ID
        
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

        stage('Build & Test') {
            parallel {
                stage('Backend Build') {
                    steps {
                        dir('back') {
                            sh 'chmod +x gradlew'
                            sh './gradlew clean build -x test'
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('front') {
                            sh 'npx pnpm install'
                            sh 'npx pnpm run build'
                        }
                    }
                }
            }
        }

        stage('Dev: Build Images') {
            when {
                expression { env.GIT_BRANCH == 'origin/develop' }
            }
            steps {
                echo "develop 브랜치: 개발 서버 배포를 시작합니다."
                withCredentials([usernamePassword(credentialsId: "${GIT_CRED_ID}", 
                                                  passwordVariable: 'GIT_TOKEN', 
                                                  usernameVariable: 'GIT_USER')]) {
                    sshagent(credentials: ["${SSH_CRED_ID}"]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${PROD_SERVER_USER}@${PROD_SERVER_IP} "
                                cd ${DEV_PATH} &&
                                git remote set-url origin https://${GIT_USER}:${GIT_TOKEN}@${REPO_URL} &&
                                git pull origin develop &&
                                sudo docker compose -f docker-compose.dev.yml up -d --build
                            "
                        """
                    }
                }
            }
        }

        stage('Master: Production Deploy') {
            when {
                expression { env.GIT_BRANCH == 'origin/master' }
            }
            steps {
                echo "master 브랜치: 운영 서버 배포를 시작합니다."
                withCredentials([usernamePassword(credentialsId: "${GIT_CRED_ID}", 
                                                  passwordVariable: 'GIT_TOKEN', 
                                                  usernameVariable: 'GIT_USER')]) {
                    sshagent(credentials: ["${SSH_CRED_ID}"]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${PROD_SERVER_USER}@${PROD_SERVER_IP} "
                                cd ${PROD_PATH} &&
                                git remote set-url origin https://${GIT_USER}:${GIT_TOKEN}@${REPO_URL} &&
                                git pull origin master &&
                                sudo docker compose -f docker-compose.prod.yml up -d --build
                            "
                        """
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