pipeline {
    agent any
    environment {
        COMPOSE = 'docker-compose -f docker-compose.part2.yml -p hospital_v2'
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Build Frontend') {
            when { changeset "frontend/**" }
            steps {
                sh 'docker run --rm -v $WORKSPACE:/ws -v npm_cache:/app/node_modules node:18-alpine sh -c "cd /ws/frontend && npm ci && npm run build && cp -r build/* /ws/backend/static/build/"'
            }
        }
        stage('Deploy') {
            steps {
                sh '$COMPOSE down || true && docker rm -f hospital-web-v2 2>/dev/null || true && $COMPOSE pull web-v2 && $COMPOSE up -d --no-build'
            }
        }
    }
    post {
        always { echo "Build took: ${currentBuild.durationString}" }
        success { echo '✅ Live on Port 8300' }
        failure { echo '❌ Failed'; sh '$COMPOSE logs --tail=20 || true' }
    }
}