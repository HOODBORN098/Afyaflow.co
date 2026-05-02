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
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countUnread(Long userId) {
        return repository.countByUserIdAndIsReadFalse(userId);
    }

    public void createNotification(User user, String title, String message, String type) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .build();
        repository.save(notification);
    }

    public void markAsRead(Long notificationId) {
        repository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            repository.save(n);
        });
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = repository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).toList();
        unread.forEach(n -> n.setRead(true));
        repository.saveAll(unread);
    }
}
