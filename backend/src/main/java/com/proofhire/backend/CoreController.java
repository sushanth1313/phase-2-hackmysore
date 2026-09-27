package com.proofhire.backend;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class CoreController {

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "ProofHire-Backend");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/student/verify-project")
    public ResponseEntity<?> verifyProject(@RequestBody Map<String, String> request) {
        String repoUrl = request.get("repoUrl");
        
        // Mock GitHub Integration & Verification Logic
        Map<String, Object> verificationResult = new HashMap<>();
        verificationResult.put("status", "VERIFIED");
        verificationResult.put("integrityScore", 98);
        verificationResult.put("techStack", new String[]{"React", "Java", "Spring Boot"});
        verificationResult.put("message", "Project authenticity confirmed via commit history.");
        
        return ResponseEntity.ok(verificationResult);
    }

    @GetMapping("/recruiter/talent-match")
    public ResponseEntity<?> findTalent(@RequestParam String role, @RequestParam int minScore) {
        // Mock Recruiter search matching
        Map<String, Object> candidate1 = new HashMap<>();
        candidate1.put("name", "Alex Developer");
        candidate1.put("role", "Backend Developer");
        candidate1.put("matchScore", 94);
        candidate1.put("capabilityScore", 84);
        candidate1.put("isVerified", true);
        
        return ResponseEntity.ok(new Object[]{candidate1});
    }
}
