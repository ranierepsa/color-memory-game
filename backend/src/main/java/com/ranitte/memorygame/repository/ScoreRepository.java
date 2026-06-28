package com.ranitte.memorygame.repository;

import com.ranitte.memorygame.model.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScoreRepository extends JpaRepository<Score, Long> {
    List<Score> findTop10ByOrderByScoreDescCreatedAtAsc();
}
