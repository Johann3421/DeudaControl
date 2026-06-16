<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VerificationController extends Controller
{
    public function notice()
    {
        return Inertia::render('Auth/VerifyEmail');
    }

    public function send(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended('/dashboard');
        }

        $request->user()->notify(new VerifyEmailNotification);

        return back()->with('success', 'Te enviamos un nuevo enlace de verificación.');
    }

    public function verify(Request $request)
    {
        if (! hash_equals((string) $request->route('id'), (string) $request->user()->getKey())) {
            throw new AuthorizationException;
        }

        if (! hash_equals((string) $request->route('hash'), sha1($request->user()->getEmailForVerification()))) {
            throw new AuthorizationException;
        }

        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended('/dashboard');
        }

        if ($request->user()->markEmailAsVerified()) {
            Auth::logout();
        }

        return redirect()->route('login')->with('success', 'Tu correo fue verificado. Inicia sesión.');
    }
}
