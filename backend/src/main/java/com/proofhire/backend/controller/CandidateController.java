package com.proofhire.backend.controller;
import com.proofhire.backend.dto.ApiResponse;
import com.proofhire.backend.model.User;
import com.proofhire.backend.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recruiter/candidates")
public class CandidateController {
    private final UserRepository repo;
    public CandidateController(UserRepository repo) { this.repo = repo; }
    
    @GetMapping
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ApiResponse<List<User>> search() {
        // Return all students for demo
        List<User> students = repo.findAll().stream()
            .filter(u -> u.getRole().name().equals("STUDENT"))
            .collect(Collectors.toList());
        return ApiResponse.success(students);
    }
}
