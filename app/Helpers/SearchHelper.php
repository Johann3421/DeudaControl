<?php

namespace App\Helpers;

use Illuminate\Database\Eloquent\Builder;

class SearchHelper
{
    /**
     * Apply a multi-word search to an Eloquent query.
     *
     * Splits the search term by spaces. Each word must match at least one
     * of the given columns (OR within a word, AND across words).
     *
     * Example: "juan perez" → matches records where (col1 contains "juan" OR col2 contains "juan")
     *          AND (col1 contains "perez" OR col2 contains "perez")
     *
     * @param Builder $query
     * @param string|null $term
     * @param array $columns            Direct column names, e.g. ['nombre', 'apellido']
     * @param array $relationColumns    Relation searches, e.g. [['cliente', ['nombre', 'apellido']]]
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
                $q->where(function (Builder $wordQuery) use ($word, $columns, $relationColumns) {
                    // Direct columns
                    foreach ($columns as $col) {
                        $wordQuery->orWhere($col, 'like', "%{$word}%");
                    }

                    // Relation columns
                    foreach ($relationColumns as $rel) {
                        [$relation, $relCols] = $rel;
                        $wordQuery->orWhereHas($relation, function (Builder $rq) use ($word, $relCols) {
                            $rq->where(function (Builder $rcq) use ($word, $relCols) {
                                foreach ($relCols as $col) {
                                    $rcq->orWhere($col, 'like', "%{$word}%");
                                }
                            });
                        });
                    }
                });
            }
        });

        return $query;
    }
}
