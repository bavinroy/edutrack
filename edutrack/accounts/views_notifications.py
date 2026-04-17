import requests
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from accounts.models import Notification
from accounts.serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    """
    Returns all notifications for the authenticated user, newest first.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

class MarkNotificationReadView(APIView):
    """
    Marks a specific notification as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            notif.is_read = True
            notif.save()
            return Response({"success": True, "message": "Notification marked as read"})
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=404)

class MarkAllNotificationsReadView(APIView):
    """
    Marks all notifications for the authenticated user as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"success": True, "message": "All notifications marked as read"})

class RegisterPushTokenView(APIView):
    """
    Registers an Expo Push Token for the current user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        token = request.data.get("token")
        if not token:
            return Response({"error": "No token provided"}, status=400)
            
        from accounts.models import PushDevice
        # Ensure the token isn't associated with anyone else first
        PushDevice.objects.filter(token=token).exclude(user=request.user).delete()
        
        device, created = PushDevice.objects.update_or_create(
            user=request.user,
            defaults={'token': token}
        )
        return Response({"success": True, "token": device.token})

    def delete(self, request, *args, **kwargs):
        from accounts.models import PushDevice
        PushDevice.objects.filter(user=request.user).delete()
        return Response({"success": True, "message": "Push notifications disabled"})

def create_notification(recipient, title, message, target_url=""):
    """
    Utility function to create a notification easily from any view and dispatch a push notification.
    """
    # 1. Save to database
    notif = Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        target_url=target_url
    )
    
    # 2. Dispatch Push Notification via Expo
    from accounts.models import PushDevice
    try:
        device = PushDevice.objects.get(user=recipient)
        expo_token = device.token
        
        push_message = {
            "to": expo_token,
            "sound": "default",
            "title": title,
            "body": message,
            "data": {"url": target_url}
        }
        
        requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=push_message,
            headers={
                "Accept": "application/json",
                "Accept-encoding": "gzip, deflate", 
                "Content-Type": "application/json"
            },
            timeout=5
        )
    except PushDevice.DoesNotExist:
        pass # User has no registered device
    except Exception as e:
        print(f"Failed to send push notification: {e}")
        
    return notif
