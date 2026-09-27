package com.proofhire.backend.repository;
import com.proofhire.backend.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByStudentId(Long studentId);
    List<Application> findByRecruiterId(Long recruiterId);
}
