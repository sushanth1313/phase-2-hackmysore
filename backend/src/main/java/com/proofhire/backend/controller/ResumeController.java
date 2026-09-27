package com.proofhire.backend.controller;
import com.proofhire.backend.dto.ApiResponse;
import com.proofhire.backend.model.ResumeVersion;
import com.proofhire.backend.model.User;
import com.proofhire.backend.repository.ResumeVersionRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {
    private final ResumeVersionRepository repo;
    public ResumeController(ResumeVersionRepository repo) { this.repo = repo; }
    
    @GetMapping
    public ApiResponse<List<ResumeVersion>> getMyResumes(@AuthenticationPrincipal User user) {
        return ApiResponse.success(repo.findByStudentId(user.getId()));
    }
    
    @PostMapping
    public ApiResponse<ResumeVersion> upload(@AuthenticationPrincipal User user, @RequestBody ResumeVersion version) {
        version.setStudentId(user.getId());
        // Simulating hash check
        version.setStatus("VERIFIED");
        return ApiResponse.success(repo.save(version));
    }
}
