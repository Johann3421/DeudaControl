<?php

namespace App\Services;

use Carbon\Carbon;

class AmortizationService
{
    public function calculate(string $type, float $principal, float $annualRate, int $months, string $startDate): array
    {
        $monthlyRate = $annualRate / 100 / 12;
        $startDate = Carbon::parse($startDate);

        return match ($type) {
            'french' => $this->frenchSystem($principal, $monthlyRate, $months, $startDate),
            'german' => $this->germanSystem($principal, $monthlyRate, $months, $startDate),
            'american' => $this->americanSystem($principal, $monthlyRate, $months, $startDate),
            default => [],
        };
    }

    /**
     * Sistema Francés: cuota fija, interés decreciente
     */
    private function frenchSystem(float $principal, float $monthlyRate, int $months, Carbon $startDate): array
    {
        // Cálculo de la cuota fija
        if ($monthlyRate == 0) {
            $payment = $principal / $months;
        } else {
            $payment = $principal * ($monthlyRate * (1 + $monthlyRate) ** $months) / ((1 + $monthlyRate) ** $months - 1);
        }

        $schedule = [];
        $balance = $principal;

        for ($i = 1; $i <= $months; $i++) {
            $dueDate = $startDate->copy()->addMonths($i);
            $interest = $balance * $monthlyRate;
            $principalPaid = $payment - $interest;

            $schedule[] = [
                'payment_number' => $i,
                'due_date' => $dueDate,
                'principal_due' => round(max(0, $principalPaid), 2),
                'interest_due' => round($interest, 2),
                'total_due' => round($payment, 2),
                'status' => 'pending',
            ];

            $balance -= $principalPaid;
        }

        return $schedule;
    }

    /**
     * Sistema Alemán: principal fijo, interés decreciente
     */
    private function germanSystem(float $principal, float $monthlyRate, int $months, Carbon $startDate): array
    {
        $principalPayment = $principal / $months;
        $schedule = [];
        $balance = $principal;

        for ($i = 1; $i <= $months; $i++) {
            $dueDate = $startDate->copy()->addMonths($i);
            $interest = $balance * $monthlyRate;
            $totalPayment = $principalPayment + $interest;

            $schedule[] = [
                'payment_number' => $i,
                'due_date' => $dueDate,
                'principal_due' => round($principalPayment, 2),
                'interest_due' => round($interest, 2),
                'total_due' => round($totalPayment, 2),
                'status' => 'pending',
            ];

            $balance -= $principalPayment;
        }

        return $schedule;
    }

    /**
     * Sistema Americano: cuota de interés periódica, principal al final
     */
    private function americanSystem(float $principal, float $monthlyRate, int $months, Carbon $startDate): array
    {
        $interestPayment = $principal * $monthlyRate;
        $schedule = [];

        for ($i = 1; $i <= $months; $i++) {
            $dueDate = $startDate->copy()->addMonths($i);

            // Última cuota incluye el principal
            if ($i == $months) {
                $schedule[] = [
                    'payment_number' => $i,
                    'due_date' => $dueDate,
                    'principal_due' => round($principal, 2),
                    'interest_due' => round($interestPayment, 2),
                    'total_due' => round($principal + $interestPayment, 2),
                    'status' => 'pending',
                ];
            } else {
                $schedule[] = [
                    'payment_number' => $i,
                    'due_date' => $dueDate,
                    'principal_due' => 0,
                    'interest_due' => round($interestPayment, 2),
                    'total_due' => round($interestPayment, 2),
                    'status' => 'pending',
                ];
            }
        }

        return $schedule;
    }
}
