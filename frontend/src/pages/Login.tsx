import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    const registeredUser = localStorage.getItem("onionq_demo_user");

    if (registeredUser) {
      const user = JSON.parse(registeredUser);

      if (
        user.email.toLowerCase() !== email.trim().toLowerCase() ||
        user.password !== password
      ) {
        setError("Invalid email or password.");
        return;
      }
    }

    localStorage.setItem("onionq_logged_in", "true");

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-7 h-7 text-gray-950" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center">
            Welcome Back
          </h1>

          <p className="text-sm text-gray-400 text-center mt-2 mb-7">
            Sign in to OnionQ Quality Inspection Platform
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-lg py-3 text-sm transition-colors"
            >
              Login
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
