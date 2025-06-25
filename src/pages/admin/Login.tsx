import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderService } from "@/services/firebase";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // دالة التحقق (سيتم ربطها لاحقًا ببيانات Firestore)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // جلب بيانات المسؤول من Firestore
      const admin: any = await orderService.getAdminByUsername(username);
      if (!admin) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      } else if (admin.password !== password) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      } else {
        localStorage.setItem("isAdmin", "true");
        navigate("/admin/orders");
      }
    } catch (err) {
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">تسجيل دخول المسؤول</h2>
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-1 font-medium">اسم المستخدم</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium">كلمة المرور</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "جاري التحقق..." : "دخول"}
        </button>
      </form>
    </div>
  );
};

export default Login; 