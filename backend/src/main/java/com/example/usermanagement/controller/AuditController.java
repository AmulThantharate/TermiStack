package com.example.usermanagement.controller;

import com.example.usermanagement.model.UserAudit;
import com.example.usermanagement.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/audits")
public class AuditController {

    private final UserService userService;

    @Autowired
    public AuditController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserAudit>> getAllAudits() {
        return new ResponseEntity<>(userService.getAllAudits(), HttpStatus.OK);
    }
}
