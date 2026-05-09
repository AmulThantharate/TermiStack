pipeline {
    agent any
    environment {
        PROJECT_NAME = 'termistack'
        BACKEND_APP_NAME = 'user-management-api'
        FRONTEND_APP_NAME = 'user-management-ui'
        REDIS_HOST = 'redis'
        POSTGRES_HOST = 'postgres'
        BACKEND_IMAGE = 'termistack/backend'
        FRONTEND_IMAGE = 'termistack/frontend'
        DOCKER_REGISTRY = ''
        NEXUS_URL = 'https://nexus.example.com'
        NEXUS_REPO = 'snapshots'
        # Maven and Node settings
        MAVEN_OPTS = '-Dmaven.repo.local=.m2'
        NPM_CONFIG_CACHE = '.npm-cache'
    }
    parameters {
        string(
            name: 'BACKEND_VERSION',
            defaultValue: 'latest',
            description: 'Version tag for backend image (default: latest)'
        )
        string(
            name: 'FRONTEND_VERSION',
            defaultValue: 'latest',
            description: 'Version tag for frontend image (default: latest)'
        )
        booleanParam(
            name: 'RUN_TESTS',
            defaultValue: true,
            description: 'Run integration/smoke tests after build'
        )
        booleanParam(
            name: 'PUSH_IMAGES',
            defaultValue: false,
            description: 'Push images to registry (requires credentials)'
        )
        booleanParam(
            name: 'UPLOAD_TO_NEXUS',
            defaultValue: false,
            description: 'Upload JAR to Nexus repository'
        )
        string(
            name: 'NEXUS_REPOSITORY',
            defaultValue: 'snapshots',
            description: 'Nexus repository: snapshots or releases'
        )
    }
    options {
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '5'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    echo "Git commit: ${env.GIT_COMMIT}"
                    echo "Git branch: ${env.GIT_BRANCH}"
                    echo "Git commit message: ${env.GIT_COMMIT_MSG}"
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    echo 'Building Spring Boot backend...'
                    sh 'mvn clean package -DskipTests --batch-mode'
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
                }
            }
        }

        stage('Backend Tests') {
            when {
                booleanParam('RUN_TESTS')
            }
            steps {
                dir('backend') {
                    echo 'Running backend unit tests...'
                    sh 'mvn test --batch-mode'
                }
            }
            post {
                success {
                    sh 'mkdir -p coverage && mvn test-compile surefire-report:report --batch-mode'
                    publishHTML target: [
                        reportDir: 'target/site',
                        reportFiles: 'surefire-report.html',
                        reportName: 'Backend Test Report'
                    ]
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    echo 'Building Next.js frontend...'
                    sh 'npm ci --cache .npm-cache --noOptional'
                    sh 'npm run build'
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'frontend/.next/**/*', fingerprint: true
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo 'Building Docker images...'

                    // Build backend image
                    sh """
                        docker build -t ${BACKEND_IMAGE}:${BACKEND_VERSION} ./backend
                        docker tag ${BACKEND_IMAGE}:${BACKEND_VERSION} ${BACKEND_IMAGE}:latest
                    """

                    // Build frontend image
                    sh """
                        docker build -t ${FRONTEND_IMAGE}:${FRONTEND_VERSION} ./frontend
                        docker tag ${FRONTEND_IMAGE}:${FRONTEND_VERSION} ${FRONTEND_IMAGE}:latest
                    """
                }
            }
        }

        stage('Upload to Nexus') {
            when {
                booleanParam('UPLOAD_TO_NEXUS')
            }
            steps {
                dir('backend') {
                    script {
                        echo "Uploading JAR to Nexus repository: ${NEXUS_REPO}..."

                        withCredentials([usernamePassword(
                            credentialsId: 'nexus-creds',
                            usernameVariable: 'NEXUS_USER',
                            passwordVariable: 'NEXUS_PASS'
                        )]) {
                            def version = '0.0.1-SNAPSHOT'
                            if (NEXUS_REPO == 'releases') {
                                version = env.BACKEND_VERSION
                            }

                            echo "Deploying version: ${version}"

                            // Configure settings.xml with Nexus credentials
                            def settingsXml = """
                                <settings>
                                    <servers>
                                        <server>
                                            <id>nexus</id>
                                            <username>${NEXUS_USER}</username>
                                            <password>${NEXUS_PASS}</password>
                                        </server>
                                        <server>
                                            <id>nexus-snapshot</id>
                                            <username>${NEXUS_USER}</username>
                                            <password>${NEXUS_PASS}</password>
                                        </server>
                                        <server>
                                            <id>nexus-release</id>
                                            <username>${NEXUS_USER}</username>
                                            <password>${NEXUS_PASS}</password>
                                        </server>
                                    </servers>
                                </settings>
                            """
                            writeFile file: 'settings.xml', text: settingsXml

                            sh """
                                mvn clean deploy \\
                                    -s settings.xml \\
                                    -P nexus-${NEXUS_REPO} \\
                                    -Drevision=${version} \\
                                    -Dnexus.url=${NEXUS_URL} \\
                                    --batch-mode
                            """

                            // Find and archive the built JAR
                            def jarFile = findFiles(glob: 'target/*.jar')[0]
                            if (jarFile) {
                                echo "Archiving JAR: ${jarFile.name}"
                                archiveArtifacts artifacts: "target/*.jar", fingerprint: true
                            }
                        }
                    }
                }
            }
            post {
                success {
                    sh 'echo "Uploaded to Nexus: ${NEXUS_URL}" >> nexus-status.txt'
                }
            }
        }

        stage('Docker Compose Integration Test') {
            when {
                booleanParam('RUN_TESTS')
            }
            steps {
                script {
                    echo 'Starting services with Docker Compose...'
                    sh """
                        docker compose up -d --build
                        echo 'Waiting for services to be ready...'
                        sleep 30
                    """

                    echo 'Running smoke tests...'
                    sh """
                        chmod +x smoke-test.sh
                        ./smoke-test.sh
                    """

                    echo 'Stopping services...'
                    sh 'docker compose down'
                }
            }
            post {
                always {
                    sh 'docker compose down 2>/dev/null || true'
                }
            }
        }

        stage('Push to Registry') {
            when {
                allOf {
                    booleanParam('PUSH_IMAGES')
                    expression { env.DOCKER_REGISTRY != '' }
                }
            }
            steps {
                script {
                    echo "Pushing images to ${DOCKER_REGISTRY}..."

                    withCredentials([usernamePassword(
                        credentialsId: 'docker-registry-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh """
                            echo ${DOCKER_PASS} | docker login ${DOCKER_REGISTRY} -u ${DOCKER_USER} --password-stdin

                            docker push ${BACKEND_IMAGE}:${BACKEND_VERSION}
                            docker push ${BACKEND_IMAGE}:latest

                            docker push ${FRONTEND_IMAGE}:${FRONTEND_VERSION}
                            docker push ${FRONTEND_IMAGE}:latest

                            docker logout ${DOCKER_REGISTRY}
                        """
                    }
                }
            }
        }

        stage('Update K8s Manifests') {
            when {
                allOf {
                    expression { fileExists('k8s/') }
                    branch 'main'
                }
            }
            steps {
                script {
                    echo 'Updating Kubernetes image tags...'

                    // Update backend image tag
                    def backendYaml = new File('k8s/backend.yaml').text
                    new File('k8s/backend.yaml').write(
                        backendYaml.replace(
                            /image: .*/,
                            "image: ${BACKEND_IMAGE}:${BACKEND_VERSION}"
                        )
                    )

                    // Update frontend image tag
                    def frontendYaml = new File('k8s/frontend.yaml').text
                    new File('k8s/frontend.yaml').write(
                        frontendYaml.replace(
                            /image: .*/,
                            "image: ${FRONTEND_IMAGE}:${FRONTEND_VERSION}"
                        )
                    )

                    echo 'Kubernetes manifests updated successfully'
                }
            }
        }
    }
    post {
        always {
            cleanUp()
        }
        success {
            echo 'Pipeline completed successfully!'
            sh 'echo "Build SUCCESS: ${env.BUILD_NUMBER}" >> build-status.txt'
        }
        failure {
            echo 'Pipeline failed!'
            sh 'echo "Build FAILED: ${env.BUILD_NUMBER}" >> build-status.txt'
            notifySlack(status: 'failure')
        }
        aborted {
            echo 'Pipeline was aborted!'
            notifySlack(status: 'aborted')
        }
    }
}

// Post-build notification function
def notifySlack(status: String) {
    if (env.SLACK_WEBHOOK_URL) {
        def color = status == 'success' ? 'good' : status == 'aborted' ? 'warning' : 'danger'
        def message = status == 'success' ? 'Pipeline completed successfully' : "Pipeline *${status.toUpperCase()}*"

        sh """
            curl -X POST -H 'Content-type: application/json' \\
                ${env.SLACK_WEBHOOK_URL} \\
                --data '{"text": "${message}", "blocks": [{"type": "section", "text": {"type": "mrkdwn", "text": "${message}"}}]}'
        """
    }
}

def cleanUp() {
    step {
        [$class: 'CleanWs']
    }
}
