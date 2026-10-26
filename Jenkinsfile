// Root Jenkinsfile delegating to jenkins/Jenkinsfile
// Compatible with standard Jenkins Multibranch and Single Pipeline projects

pipeline {
    agent any

    parameters {
        booleanParam(
            name: 'BUILD_DOCKER_IMAGES',
            defaultValue: false,
            description: 'Enable Docker image build stage (Requires Docker daemon running on Jenkins agent)'
        )
        stringParam(
            name: 'IMAGE_TAG',
            defaultValue: '1.0.0',
            description: 'Docker image tag version'
        )
    }

    tools {
        jdk 'JDK-21'
        nodejs 'NodeJS-24'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '5'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo '=== Stage 1: Checking out source code from Git repository ==='
                checkout scm
                script {
                    if (isUnix()) {
                        sh 'git log -1 --stat'
                    } else {
                        bat 'git log -1 --stat'
                    }
                }
            }
        }

        stage('Validate Environment') {
            steps {
                echo '=== Stage 2: Verifying Compiler & Runtime Environments ==='
                script {
                    if (isUnix()) {
                        sh 'java -version'
                        sh 'node -v'
                        sh 'npm -v'
                        sh 'git --version'
                    } else {
                        bat 'java -version'
                        bat 'node -v'
                        bat 'npm -v'
                        bat 'git --version'
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo '=== Stage 3: Installing Frontend Dependencies & Building Assets ==='
                dir('frontend') {
                    script {
                        if (isUnix()) {
                            sh 'npm ci || npm install'
                            sh 'npm run build'
                        } else {
                            bat 'npm ci || npm install'
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Test Frontend') {
            steps {
                echo '=== Stage 4: Executing Vitest Frontend Unit Tests ==='
                dir('frontend') {
                    script {
                        if (isUnix()) {
                            sh 'npm test'
                        } else {
                            bat 'npm test'
                        }
                    }
                }
            }
        }

        stage('Build & Test Spring Boot Backend') {
            steps {
                echo '=== Stage 5: Compiling & Running JUnit 5 Integration Tests ==='
                dir('springboot-app') {
                    script {
                        if (isUnix()) {
                            sh 'chmod +x mvnw || true'
                            sh './mvnw clean test'
                        } else {
                            bat 'mvnw.cmd clean test'
                        }
                    }
                }
            }
            post {
                always {
                    junit testResults: 'springboot-app/target/surefire-reports/*.xml', allowEmptyResults: true
                }
            }
        }

        stage('Package Application') {
            steps {
                echo '=== Stage 6: Packaging Executable Spring Boot JAR ==='
                dir('springboot-app') {
                    script {
                        if (isUnix()) {
                            sh './mvnw package -DskipTests=true'
                        } else {
                            bat 'mvnw.cmd package -DskipTests=true'
                        }
                    }
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'springboot-app/target/*.jar', fingerprint: true, allowEmptyArchive: false
                }
            }
        }

        stage('Build Docker Images') {
            when {
                expression { return params.BUILD_DOCKER_IMAGES == true }
            }
            steps {
                echo "=== Stage 7: Building Multi-Container Docker Images (Tag: ${params.IMAGE_TAG}) ==="
                script {
                    if (isUnix()) {
                        sh "docker build -t smartcitizen/springboot-backend:${params.IMAGE_TAG} -f springboot-app/Dockerfile springboot-app"
                        sh "docker build -t smartcitizen/react-frontend:${params.IMAGE_TAG} -f frontend/Dockerfile frontend"
                        sh "docker build -t smartcitizen/flask-service:${params.IMAGE_TAG} -f flask-app/Dockerfile flask-app"
                        sh "docker images | grep smartcitizen"
                    } else {
                        bat "docker build -t smartcitizen/springboot-backend:${params.IMAGE_TAG} -f springboot-app/Dockerfile springboot-app"
                        bat "docker build -t smartcitizen/react-frontend:${params.IMAGE_TAG} -f frontend/Dockerfile frontend"
                        bat "docker build -t smartcitizen/flask-service:${params.IMAGE_TAG} -f flask-app/Dockerfile flask-app"
                        bat "docker images | findstr smartcitizen"
                    }
                }
            }
        }
    }

    post {
        always {
            echo '==================================================='
            echo "CI/CD Pipeline Build Finished with Status: ${currentBuild.currentResult}"
            echo "Build URL: ${env.BUILD_URL}"
            echo '==================================================='
        }
        success {
            echo 'SUCCESS: Continuous Integration & Delivery Pipeline verified all components.'
        }
        failure {
            echo 'FAILURE: One or more stages failed during pipeline execution. Review console logs above.'
        }
    }
}
