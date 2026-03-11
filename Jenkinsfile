pipeline {
    agent any

    options {
        gitLabConnection('A505')
    }

    environment {
        // 운영 서버 정보 (본인의 환경에 맞게 수정)
        PROD_SERVER_IP = "13.124.55.70"
        PROD_SERVER_USER = "ubuntu"
        SSH_CRED_ID = "ssh-agent-key"
        DEV_PATH = "/home/ubuntu/jupasu_dev"
        PROD_PATH = "/home/ubuntu/jupasu_prod" // 서버 내 프로젝트 위치
    }

    stages {
        stage('Source Checkout') {
            steps {
                updateGitlabCommitStatus name: 'Jenkins/Build', state: 'running'
                // GitLab Branch Source 사용 시 scm 변수로 자동 체크아웃
                checkout scm
            }
        }

        // 테스트용
        stage('Check Environment'){
            steps{
                sh 'printenv' 
            
                // 특정 변수 개별 확인
                echo "BRANCH_NAME: ${env.BRANCH_NAME}"
                echo "GIT_BRANCH: ${env.GIT_BRANCH}"
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

        // [dev 브랜치 전용] 자동 빌드 및 이미지 생성 검증
        stage('Dev: Build Images') {
            when { branch 'develop' }
            steps {
                echo "dev 브랜치: 개발 서버 배포를 시작합니다."
                sshagent(credentials: ["${SSH_CRED_ID}"]) {
                    // 최신 코드를 받고 docker-compose.develop 실행
                    sh """
                        ssh -o StrictHostKeyChecking=no ${PROD_SERVER_USER}@${PROD_SERVER_IP} "
                            cd ${DEV_PATH} &&
                            git pull origin develop &&
                            sudo docker compose -f docker-compose.dev.yml up -d --build
                        "
                    """
                }
            }
        }

        // [master 브랜치 전용] 자동 배포 (운영 서버 접속 및 실행)
        stage('Master: Production Deploy') {
            when { branch 'master' }
            steps {
                echo "master 브랜치: 운영 서버 배포를 시작합니다."
                sshagent(credentials: ["${SSH_CRED_ID}"]) {
                    // 운영 서버에 접속하여 최신 코드를 받고 docker-compose 실행
                    sh """
                        ssh -o StrictHostKeyChecking=no ${PROD_SERVER_USER}@${PROD_SERVER_IP} "
                            cd ${PROD_PATH} &&
                            git pull origin master &&
                            sudo docker compose -f docker-compose.prod.yml up -d --build
                        "
                    """
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