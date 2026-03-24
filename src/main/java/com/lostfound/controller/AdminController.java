package com.lostfound.controller;

import com.lostfound.dto.AdminDto;
import com.lostfound.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin

public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // ── Dashboard stats ──────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<AdminDto.StatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    // ── Users ────────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<List<AdminDto.UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminDto.UserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestBody AdminDto.RoleUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateUserRole(id, request.getRole()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ── Items ────────────────────────────────────────────
    @GetMapping("/items")
    public ResponseEntity<List<AdminDto.ItemResponse>> getAllItems() {
        return ResponseEntity.ok(adminService.getAllItems());
    }

    @PatchMapping("/items/{id}/status")
    public ResponseEntity<AdminDto.ItemResponse> updateItemStatus(
            @PathVariable Long id,
            @RequestBody AdminDto.StatusUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateItemStatus(id, request.getStatus()));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        adminService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}
