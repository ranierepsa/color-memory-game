package com.ranitte.memorygame.controller;

import com.ranitte.memorygame.model.Score;
import com.ranitte.memorygame.repository.ScoreRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    private final ScoreRepository repo;

    public ScoreController(ScoreRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/top")
    public List<Score> top() {
        return repo.findTop10ByOrderByScoreDescCreatedAtAsc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Score save(@RequestBody ScoreRequest req) {
        return repo.save(new Score(req.name(), req.score()));
    }

    public record ScoreRequest(String name, Integer score) {}
}
