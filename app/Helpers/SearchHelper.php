<?php

namespace App\Helpers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class SearchHelper
{
    /**
     * Apply a multi-word, case-insensitive search to an Eloquent query.
     * Uses LOWER() + LIKE for cross-database compatibility (PostgreSQL, SQLite).
     *
     * @param Builder $query
     * @param string|null $term
     * @param array $columns            Direct column names
     * @param array $relationColumns    [['relation', ['col1', 'col2']]]
     * @return Builder
     */
    public static function apply(Builder $query, ?string $term, array $columns = [], array $relationColumns = []): Builder
    {
        if (empty(trim($term ?? ''))) {
            return $query;
        }

        $words = preg_split('/\s+/', trim($term));

        $query->where(function (Builder $q) use ($words, $columns, $relationColumns) {
            foreach ($words as $word) {
                $lower = strtolower($word);
                $q->where(function (Builder $wq) use ($lower, $columns, $relationColumns) {
                    foreach ($columns as $col) {
                        $wq->orWhereRaw("LOWER({$col}) LIKE ?", ["%{$lower}%"]);
                    }
                    foreach ($relationColumns as $rel) {
                        [$relation, $relCols] = $rel;
                        $wq->orWhereHas($relation, function (Builder $rq) use ($lower, $relCols) {
                            foreach ($relCols as $col) {
                                $rq->orWhereRaw("LOWER({$col}) LIKE ?", ["%{$lower}%"]);
                            }
                        });
                    }
                });
            }
        });

        return $query;
    }
}
