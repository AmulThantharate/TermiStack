package com.example.usermanagement.service;

import com.example.usermanagement.model.User;
import com.example.usermanagement.model.UserAudit;
import com.example.usermanagement.repository.UserAuditRepository;
import com.example.usermanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock UserAuditRepository userAuditRepository;
    @InjectMocks UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User("1", "Alice", "alice@example.com");
    }

    @Test
    void createUser_assignsIdAndSaves() {
        User noId = new User(null, "Bob", "bob@example.com");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(userAuditRepository.save(any())).thenReturn(null);

        User result = userService.createUser(noId);

        assertThat(result.getId()).isNotNull();
        verify(userAuditRepository).save(any(UserAudit.class));
    }

    @Test
    void getUserById_returnsUser() {
        when(userRepository.findById("1")).thenReturn(Optional.of(user));

        assertThat(userService.getUserById("1")).contains(user);
    }

    @Test
    void getAllUsers_returnsList() {
        when(userRepository.findAll()).thenReturn(List.of(user));

        assertThat(userService.getAllUsers()).containsExactly(user);
    }

    @Test
    void deleteUser_auditsAndDeletes() {
        when(userRepository.findById("1")).thenReturn(Optional.of(user));

        userService.deleteUser("1");

        verify(userAuditRepository).save(any(UserAudit.class));
        verify(userRepository).deleteById("1");
    }
}
