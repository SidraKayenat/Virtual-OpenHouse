import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import TabHeader from "@/components/TabHeader";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organization: "",
    phoneNumber: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });

      navigate("/"); // or dashboard later
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat flex items-center justify-center no-scrollbar"
      style={{ backgroundImage: "url(/bg.png)" }}
    >
      <div className="relative z-10 m-10 min-w-md">
        <div className=" bg-white/20 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden p-5">
          {/* Tab Header */}
          <TabHeader activeTab="signup" />

          {/* Content */}
          <div className="p-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Sign up
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <Input
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full  rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full  rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number
                </label>
                <div className="flex gap-2">
                  <Input
                    name="phoneNumber"
                    placeholder="Phone number"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className="flex-1 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <Input
                  name="organization"
                  placeholder="Organization"
                  value={form.organization}
                  onChange={handleChange}
                  className="w-full rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="size-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="size-4" />
                        Show
                      </>
                    )}
                  </button>
                </div>
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full  rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Use 8 or more characters with a mix of letters, numbers &
                  symbols
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full  py-5 text-white font-semibold rounded-full mt-6"
                disabled={loading}
              >
                {loading ? "Creating..." : "Sign up"}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-700 mt-6">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 underline font-semibold hover:text-blue-700"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
