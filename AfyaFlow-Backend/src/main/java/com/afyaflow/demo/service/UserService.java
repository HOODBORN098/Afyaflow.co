package com.afyaflow.demo.service;

import com.afyaflow.demo.model.User;
import com.afyaflow.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public User createUser(User user) {
        return repository.save(user);
    }

    public List<User> getUsers() {
        return repository.findAll();
    }

    public User getUser(Long id) {
        return repository.findById(id).orElse(null);
    }
}
