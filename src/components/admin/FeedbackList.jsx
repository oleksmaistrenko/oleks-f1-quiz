import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth, getUserProfile } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const FeedbackList = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }
      try {
        const profile = await getUserProfile(currentUser.uid);
        if (profile?.role !== "admin") {
          navigate("/");
          return;
        }
        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error loading feedback:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="card">
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="card-title">Radio Messages</h1>

      {feedback.length === 0 ? (
        <p className="text-secondary">No messages yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {feedback.map((item) => (
            <div key={item.id} className="question-container">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <span className="text-gold font-bold">{item.username}</span>
                <span className="text-secondary text-sm">
                  {item.createdAt?.toDate
                    ? item.createdAt.toDate().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
              <p className="text-secondary" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
