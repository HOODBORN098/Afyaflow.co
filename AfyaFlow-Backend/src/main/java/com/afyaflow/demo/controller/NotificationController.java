package com.afyaflow.demo.controller;

import com.afyaflow.demo.model.Notification;
import com.afyaflow.demo.model.User;
import com.afyaflow.demo.repository.UserRepository;
import com.afyaflow.demo.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    private final UserRepository userRepository;

    public NotificationController(NotificationService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(service.getNotificationsForUser(user.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(service.countUnread(user.getId()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        service.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        service.markAllAsRead(user.getId());
        return ResponseEntity.noContent().build();
    }
}
