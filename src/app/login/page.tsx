'use client';

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent } from "@/components/ui/card";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); 

    if (!email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("https://instagram-backend-hb8j.onrender.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user))
        // localStorage.setItem('userId', data.user._id);
        console.log("Token:", localStorage.getItem('token'));
        console.log("User:", localStorage.getItem('user'));
        // console.log("User ID:", localStorage.getItem('userId'));
        window.location.href = "/home";
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.log(error)
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <Card className="w-full sm:w-[400px] p-6 rounded-lg shadow-lg bg-white">
        <CardContent>
          <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2"
                placeholder="Enter your email"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2"
                placeholder="Enter your password"
              />
            </div>

            {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="text-center text-sm mt-4">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              onClick={(e) => { e.preventDefault(); window.location.href = "/register"; }}
              className="text-blue-500 hover:underline"
            >
              Sign Up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
