import os

files = {
    # ------------------ MODELS ------------------
    "src/main/java/com/proofhire/backend/model/Challenge.java": """package com.proofhire.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Challenge {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String title;
    @Column(columnDefinition = "TEXT") private String description;
    private String difficulty;
    private LocalDateTime createdAt;
    
    public Challenge() {}
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
""",
    "src/main/java/com/proofhire/backend/model/Project.java": """package com.proofhire.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Project {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long studentId;
    private String title;
    private String repositoryUrl;
    @Column(columnDefinition = "TEXT") private String description;
    private LocalDateTime createdAt;
    private String verificationStatus; // PENDING, VERIFIED, MODIFIED, FAILED
    
    public Project() {}
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getRepositoryUrl() { return repositoryUrl; }
    public void setRepositoryUrl(String repositoryUrl) { this.repositoryUrl = repositoryUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
}
""",
    "src/main/java/com/proofhire/backend/model/Submission.java": """package com.proofhire.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Submission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long studentId;
    private Long challengeId;
    private Long projectId;
    private String status; // SUBMITTED, REVIEWED
    private LocalDateTime createdAt;
    
    public Submission() {}
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public Long getChallengeId() { return challengeId; }
    public void setChallengeId(Long challengeId) { this.challengeId = challengeId; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
""",
    "src/main/java/com/proofhire/backend/model/ResumeVersion.java": """package com.proofhire.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class ResumeVersion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long studentId;
    private String fileUrl;
    private String sha256Hash;
    private String status; // VERIFIED, MODIFIED
    private LocalDateTime uploadedAt;
    
    public ResumeVersion() {}
    @PrePersist protected void onCreate() { uploadedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
""",
    "src/main/java/com/proofhire/backend/model/CapabilityScore.java": """package com.proofhire.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class CapabilityScore {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long studentId;
    private Double score;
    private LocalDateTime updatedAt;
    
    public CapabilityScore() {}
    @PrePersist @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
""",
    "src/main/java/com/proofhire/backend/model/Application.java": """package com.proofhire.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Application {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long studentId;
    private Long recruiterId;
    private String role;
    private String status; // APPLIED, SHORTLISTED, REJECTED
    private LocalDateTime createdAt;
    
    public Application() {}
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public Long getRecruiterId() { return recruiterId; }
    public void setRecruiterId(Long recruiterId) { this.recruiterId = recruiterId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
""",

    # ------------------ REPOSITORIES ------------------
    "src/main/java/com/proofhire/backend/repository/ChallengeRepository.java": """package com.proofhire.backend.repository;
import com.proofhire.backend.model.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ChallengeRepository extends JpaRepository<Challenge, Long> {}
""",
    "src/main/java/com/proofhire/backend/repository/ProjectRepository.java": """package com.proofhire.backend.repository;
import com.proofhire.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStudentId(Long studentId);
}
""",
    "src/main/java/com/proofhire/backend/repository/SubmissionRepository.java": """package com.proofhire.backend.repository;
import com.proofhire.backend.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByStudentId(Long studentId);
}
""",
    "src/main/java/com/proofhire/backend/repository/ResumeVersionRepository.java": """package com.proofhire.backend.repository;
import com.proofhire.backend.model.ResumeVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ResumeVersionRepository extends JpaRepository<ResumeVersion, Long> {
    List<ResumeVersion> findByStudentId(Long studentId);
}
""",
    "src/main/java/com/proofhire/backend/repository/CapabilityScoreRepository.java": """package com.proofhire.backend.repository;
import com.proofhire.backend.model.CapabilityScore;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface CapabilityScoreRepository extends JpaRepository<CapabilityScore, Long> {
    Optional<CapabilityScore> findByStudentId(Long studentId);
}
""",
    "src/main/java/com/proofhire/backend/repository/ApplicationRepository.java": """package com.proofhire.backend.repository;
import com.proofhire.backend.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByStudentId(Long studentId);
    List<Application> findByRecruiterId(Long recruiterId);
}
""",

    # ------------------ CONTROLLERS ------------------
    "src/main/java/com/proofhire/backend/controller/ChallengeController.java": """package com.proofhire.backend.controller;
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
""",
    "src/main/java/com/proofhire/backend/controller/ProjectController.java": """package com.proofhire.backend.controller;
import com.proofhire.backend.dto.ApiResponse;
import com.proofhire.backend.model.Project;
import com.proofhire.backend.model.User;
import com.proofhire.backend.repository.ProjectRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectRepository repo;
    public ProjectController(ProjectRepository repo) { this.repo = repo; }
    
    @GetMapping
    public ApiResponse<List<Project>> getMyProjects(@AuthenticationPrincipal User user) {
        return ApiResponse.success(repo.findByStudentId(user.getId()));
    }
    
    @PostMapping
    public ApiResponse<Project> create(@AuthenticationPrincipal User user, @RequestBody Project project) {
        project.setStudentId(user.getId());
        project.setVerificationStatus("PENDING");
        return ApiResponse.success(repo.save(project));
    }
}
""",
    "src/main/java/com/proofhire/backend/controller/ResumeController.java": """package com.proofhire.backend.controller;
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
""",
    "src/main/java/com/proofhire/backend/controller/CapabilityController.java": """package com.proofhire.backend.controller;
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
""",
    "src/main/java/com/proofhire/backend/controller/CandidateController.java": """package com.proofhire.backend.controller;
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
"""
}

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

