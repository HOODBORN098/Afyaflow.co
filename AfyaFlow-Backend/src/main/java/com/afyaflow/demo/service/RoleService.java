package com.afyaflow.demo.service;

import com.afyaflow.demo.model.Role;
import com.afyaflow.demo.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class RoleService {

    private final RoleRepository repository;

    public RoleService(RoleRepository repository) {
        this.repository = repository;
    }

    public Role createRole(Role role) {
        return repository.save(role);
    }

    public List<Role> getRoles() {
        return repository.findAll();
    }
}
