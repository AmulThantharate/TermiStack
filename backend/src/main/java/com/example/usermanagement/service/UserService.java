package com.example.usermanagement.service;

import com.example.usermanagement.model.User;
import com.example.usermanagement.model.UserAudit;
import com.example.usermanagement.repository.UserAuditRepository;
import com.example.usermanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserAuditRepository userAuditRepository;

    @Autowired
    public UserService(UserRepository userRepository, UserAuditRepository userAuditRepository) {
        this.userRepository = userRepository;
        this.userAuditRepository = userAuditRepository;
    }

    public User createUser(User user) {
        if (user.getId() == null || user.getId().isEmpty()) {
            user.setId(UUID.randomUUID().toString());
        }
        User savedUser = userRepository.save(user);
        userAuditRepository.save(UserAudit.fromUser("CREATE", savedUser));
        return savedUser;
    }

    public User updateUser(String id, User user) {
        user.setId(id);
        User savedUser = userRepository.save(user);
        userAuditRepository.save(UserAudit.fromUser("UPDATE", savedUser));
        return savedUser;
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public List<User> getAllUsers() {
        List<User> users = new ArrayList<>();
        userRepository.findAll().forEach(users::add);
        return users;
    }

    public List<UserAudit> getAllAudits() {
        return userAuditRepository.findAll();
    }

    public void deleteUser(String id) {
        userRepository.findById(id)
                .ifPresent(user -> userAuditRepository.save(UserAudit.fromUser("DELETE", user)));
        userRepository.deleteById(id);
    }
}
