package com.proofhire.backend.controller;
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
