package com.proofhire.backend.controller;
import com.proofhire.backend.dto.ApiResponse;
import com.proofhire.backend.model.CapabilityScore;
import com.proofhire.backend.model.User;
import com.proofhire.backend.repository.CapabilityScoreRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/capability")
public class CapabilityController {
    private final CapabilityScoreRepository repo;
    public CapabilityController(CapabilityScoreRepository repo) { this.repo = repo; }
    
    @GetMapping("/me")
    public ApiResponse<CapabilityScore> getMyScore(@AuthenticationPrincipal User user) {
        return ApiResponse.success(repo.findByStudentId(user.getId()).orElseGet(() -> {
            CapabilityScore score = new CapabilityScore();
            score.setStudentId(user.getId());
            score.setScore(0.0);
            return repo.save(score);
        }));
    }
}
