pipeline {
    agent any
    
    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.part2.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Frontend') {
            // Only run if frontend actually changed
            when {
                changeset "frontend/**"
            }
            steps {
                script {
                    echo 'Building Frontend...'
                    // Cache node_modules in Jenkins workspace
                    sh '''
                        docker run --rm \
                            -v ${WORKSPACE}/frontend:/app \
                            -v ${WORKSPACE}/frontend/node_modules:/app/node_modules \
                            node:18-alpine sh -c "
                                cd /app &&
                                if [ ! -d node_modules/.bin ]; then
                                    npm ci --prefer-offline
                                fi &&
                                npm run build &&
                                mkdir -p /workspace/backend/static/build &&
                                cp -r build/* /workspace/backend/static/build/
                            "
                    '''
                }
            }
        }

        stage('Deploy (Part-II)') {
            steps {
                script {
                    echo 'Deploying with pre-built image + volume mount...'
                    
                    // Pull latest image (fast if no changes)
                    sh "docker-compose -f ${DOCKER_COMPOSE_FILE} pull web-v2 || true"
                    
                    // Start containers - NO BUILD, just volume mount
                    sh "docker-compose -f ${DOCKER_COMPOSE_FILE} -p hospital_v2 up -d --no-build"
                    
                    // Restart to pick up new code from volume (instant)
                    sh "docker-compose -f ${DOCKER_COMPOSE_FILE} -p hospital_v2 restart web-v2 || true"
                }
            }
        }
    }

    post {
        always {
            echo "Build took: ${currentBuild.durationString}"
        }
        success {
            echo '✅ Deployment successful! Part-II is live on Port 8300.'
        }
        failure {
            echo '❌ Deployment failed. Checking logs...'
            sh "docker-compose -f ${DOCKER_COMPOSE_FILE} -p hospital_v2 logs --tail=50"
        }
    }
}
