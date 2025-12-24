from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated


class AllowOptionsAuthentication(IsAuthenticated):
    """
    Разрешает OPTIONS запросы без аутентификации (для CORS preflight)
    """
    def has_permission(self, request, view):
        if request.method == 'OPTIONS':
            return True
        return super().has_permission(request, view)


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        # OPTIONS запросы разрешаем всегда (для CORS)
        if request.method == 'OPTIONS':
            return True
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        # OPTIONS запросы разрешаем всегда (для CORS)
        if request.method == 'OPTIONS':
            return True
        if request.method in SAFE_METHODS:
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user or (request.user.is_authenticated and request.user.role == 'admin')
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user or (request.user.is_authenticated and request.user.role == 'admin')
        # fallback: admins
        return request.user.is_authenticated and request.user.role == 'admin'