package com.afyaflow.demo.service;

import com.afyaflow.demo.model.Notification;
import com.afyaflow.demo.model.User;
import com.afyaflow.demo.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        if (userId == null) return List.of();
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countUnread(Long userId) {
        if (userId == null) return 0;
        return repository.countByUserIdAndIsReadFalse(userId);
    }

    public void createNotification(User user, String title, String message, String type) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .build();
        if (notification != null) {
            repository.save(notification);
        }
    }

    public void markAsRead(Long notificationId) {
        if (notificationId == null) return;
        repository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            repository.save(n);
        });
    }

    public void markAllAsRead(Long userId) {
        if (userId == null) return;
        List<Notification> unread = repository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).toList();
        unread.forEach(n -> n.setRead(true));
        repository.saveAll(unread);
    }
}
