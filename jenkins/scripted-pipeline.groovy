/**
 * Smart Citizen Complaint Management Portal
 * Scripted Pipeline Implementation (jenkins/scripted-pipeline.groovy)
 * B.Tech CSE DevOps Lab - Course Outcome 2 (CI/CD Using Jenkins)
 */

properties([
    parameters([
        booleanParam(
            name: 'DEPLOY_TO_KUBERNETES',
            defaultValue: true,
            description: 'Build container images and deploy to the Jenkins agent Kubernetes context'
        ),
        string(
            name: 'IMAGE_TAG',
            defaultValue: '',
            description: 'Optional Docker image tag; defaults to a unique build tag'
        ),
        choice(
            name: 'KUBERNETES_PROVIDER',
            choices: ['docker-desktop', 'minikube'],
            description: 'Local Kubernetes provider used by the Jenkins agent'
        )
    ])
])

node {
    def buildStatus = 'SUCCESS'
    def shouldDeploy = params.DEPLOY_TO_KUBERNETES == true

    try {
        stage('Checkout SCM') {
            echo ">>> [Stage 1] Checking out source code from Git repository..."
            checkout scm
            if (isUnix()) {
                sh 'git log -1 --oneline'
            } else {
                bat 'git log -1 --oneline'
            }
        }

        stage('Validate Toolchain') {
            echo ">>> [Stage 2] Inspecting compiler and runtime versions..."
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

        stage('Frontend Build & Test') {
            echo ">>> [Stage 3] Building React application & running Vitest unit tests..."
            dir('frontend') {
                if (isUnix()) {
                    sh 'npm install'
                    sh 'npm test'
                    sh 'npm run build'
                } else {
                    bat 'npm install'
                    bat 'npm test'
                    bat 'npm run build'
                }
            }
        }

        stage('Backend Compilation & Tests') {
            echo ">>> [Stage 4] Compiling Spring Boot & running JUnit 5 integration tests..."
            dir('springboot-app') {
                if (isUnix()) {
                    sh 'chmod +x mvnw || true'
                    sh './mvnw clean test'
                } else {
                    bat 'mvnw.cmd clean test'
                }
            }
            // Archive test results
            junit testResults: 'springboot-app/target/surefire-reports/*.xml', allowEmptyResults: true
        }

        stage('Package Application') {
            echo ">>> [Stage 5] Packaging executable Spring Boot JAR..."
            dir('springboot-app') {
                if (isUnix()) {
                    sh './mvnw package -DskipTests=true'
                } else {
                    bat 'mvnw.cmd package -DskipTests=true'
                }
            }
            archiveArtifacts artifacts: 'springboot-app/target/*.jar', fingerprint: true
        }

        stage('Build & Deploy to Kubernetes') {
            if (shouldDeploy) {
                def imageTag = params.IMAGE_TAG?.trim() ?: "build-${env.BUILD_NUMBER}"
                if (!(imageTag ==~ /[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}/)) {
                    error('IMAGE_TAG must be a valid Docker tag (letters, digits, _, ., and - only).')
                }
                def expectedContext = params.KUBERNETES_PROVIDER == 'minikube' ? 'minikube' : 'docker-desktop'
                def currentContext = isUnix()
                    ? sh(script: 'kubectl config current-context', returnStdout: true).trim()
                    : bat(script: '@echo off\r\nkubectl config current-context', returnStdout: true).trim()
                if (currentContext != expectedContext) {
                    error("Kubernetes context '${currentContext}' does not match provider '${params.KUBERNETES_PROVIDER}' (expected '${expectedContext}').")
                }

                echo ">>> [Stage 6] Building application images (Tag: ${imageTag})..."
                if (isUnix()) {
                    sh "docker build -t smartcitizen/springboot-backend:${imageTag} -f springboot-app/Dockerfile springboot-app"
                    sh "docker build -t smartcitizen/react-frontend:${imageTag} -f frontend/Dockerfile frontend"
                    if (params.KUBERNETES_PROVIDER == 'minikube') {
                        sh "minikube image load smartcitizen/springboot-backend:${imageTag}"
                        sh "minikube image load smartcitizen/react-frontend:${imageTag}"
                    }
                    sh 'kubectl apply -f k8s/00-namespace.yaml'
                    sh 'kubectl apply -f k8s/01-configmap.yaml -f k8s/02-pvc.yaml -f k8s/04-backend-service.yaml -f k8s/06-frontend-service.yaml'
                } else {
                    bat "docker build -t smartcitizen/springboot-backend:${imageTag} -f springboot-app/Dockerfile springboot-app"
                    bat "docker build -t smartcitizen/react-frontend:${imageTag} -f frontend/Dockerfile frontend"
                    if (params.KUBERNETES_PROVIDER == 'minikube') {
                        bat "minikube image load smartcitizen/springboot-backend:${imageTag}"
                        bat "minikube image load smartcitizen/react-frontend:${imageTag}"
                    }
                    bat 'kubectl apply -f k8s/00-namespace.yaml'
                    bat 'kubectl apply -f k8s/01-configmap.yaml -f k8s/02-pvc.yaml -f k8s/04-backend-service.yaml -f k8s/06-frontend-service.yaml'
                }

                withCredentials([
                    string(credentialsId: 'smart-citizen-jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'smart-citizen-admin-provision-key', variable: 'ADMIN_PROVISION_KEY')
                ]) {
                    if (isUnix()) {
                        sh '''
                            set +x
                            kubectl create secret generic smart-citizen-secrets \
                              --namespace=smart-citizen \
                              --from-literal=JWT_SECRET="$JWT_SECRET" \
                              --from-literal=ADMIN_PROVISION_KEY="$ADMIN_PROVISION_KEY" \
                              --dry-run=client -o yaml | kubectl apply -f -
                        '''
                    } else {
                        bat '''
                            @echo off
                            kubectl create secret generic smart-citizen-secrets --namespace=smart-citizen --from-literal=JWT_SECRET="%JWT_SECRET%" --from-literal=ADMIN_PROVISION_KEY="%ADMIN_PROVISION_KEY%" --dry-run=client -o yaml | kubectl apply -f -
                        '''
                    }
                }

                def backendManifest = readFile('k8s/03-backend-deployment.yaml')
                    .replace('image: smartcitizen/springboot-backend:1.0.0', "image: smartcitizen/springboot-backend:${imageTag}")
                def frontendManifest = readFile('k8s/05-frontend-deployment.yaml')
                    .replace('image: smartcitizen/react-frontend:1.0.0', "image: smartcitizen/react-frontend:${imageTag}")
                if (!backendManifest.contains("image: smartcitizen/springboot-backend:${imageTag}")
                    || !frontendManifest.contains("image: smartcitizen/react-frontend:${imageTag}")) {
                    error('Failed to apply the selected image tag to the Kubernetes deployment manifests.')
                }
                def deploymentManifestPath = "k8s/jenkins-deployment-${env.BUILD_NUMBER}.yaml"
                try {
                    writeFile file: deploymentManifestPath, text: "${backendManifest}\n---\n${frontendManifest}"
                    if (isUnix()) {
                        sh "kubectl apply -f ${deploymentManifestPath}"
                        sh 'kubectl rollout status deployment/springboot-backend -n smart-citizen --timeout=180s'
                        sh 'kubectl rollout status deployment/react-frontend -n smart-citizen --timeout=180s'
                        sh 'kubectl get services -n smart-citizen'
                    } else {
                        bat "kubectl apply -f ${deploymentManifestPath}"
                        bat 'kubectl rollout status deployment/springboot-backend -n smart-citizen --timeout=180s'
                        bat 'kubectl rollout status deployment/react-frontend -n smart-citizen --timeout=180s'
                        bat 'kubectl get services -n smart-citizen'
                    }
                } finally {
                    if (fileExists(deploymentManifestPath)) {
                        if (isUnix()) {
                            sh "rm -f ${deploymentManifestPath}"
                        } else {
                            bat "del /q k8s\\jenkins-deployment-${env.BUILD_NUMBER}.yaml"
                        }
                    }
                }
                if (params.KUBERNETES_PROVIDER == 'minikube') {
                    echo 'Deployment complete. Open the portal with: minikube service react-frontend -n smart-citizen'
                } else {
                    echo 'Deployment complete. Portal URL: http://localhost:30080'
                }
            } else {
                echo '>>> [Stage 6 Skipped] DEPLOY_TO_KUBERNETES is false. CI build and tests completed without deployment.'
            }
        }

    } catch (Exception ex) {
        buildStatus = 'FAILURE'
        currentBuild.result = 'FAILURE'
        echo "ERROR: Pipeline failed during execution with exception: ${ex.getMessage()}"
        throw ex

    } finally {
        stage('Pipeline Notification & Teardown') {
            echo "========================================================"
            echo "Scripted Pipeline Complete. Final Status: ${buildStatus}"
            echo "Build URL: ${env.BUILD_URL}"
            echo "========================================================"
        }
    }
}
