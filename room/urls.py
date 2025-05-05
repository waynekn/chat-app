from django.urls import path

from .import views
urlpatterns = [
    path("xyz/", views.PlaceHolder.as_view())
]
