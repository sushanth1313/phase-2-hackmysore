package com.proofhire.backend.controller;
import com.proofhire.backend.dto.ApiResponse;
import com.proofhire.backend.model.Challenge;
import com.proofhire.backend.repository.ChallengeRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/challenges")
public class ChallengeController {
    private final ChallengeRepository repo;
    public ChallengeController(ChallengeRepository repo) { this.repo = repo; }
    
    @GetMapping
    public ApiResponse<List<Challenge>> getAll() {
        return ApiResponse.success(repo.findAll());
    }
    
    @PostMapping
    public ApiResponse<Challenge> create(@RequestBody Challenge challenge) {
        return ApiResponse.success(repo.save(challenge));
    }
}
