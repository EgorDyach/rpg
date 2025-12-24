"""
Middleware для обработки CORS OPTIONS запросов
"""
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin


class CorsOptionsMiddleware(MiddlewareMixin):
    """
    Обрабатывает OPTIONS запросы для CORS preflight
    """
    def process_request(self, request):
        if request.method == 'OPTIONS':
            response = JsonResponse({}, status=200)
            response['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
            response['Access-Control-Max-Age'] = '86400'
            return response
        return None


