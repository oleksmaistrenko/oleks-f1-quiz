import React, { useState, useEffect } from "react";
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";

const Feedback = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const addToast = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
      } else {
        setUser(currentUser);
        try {
          const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (profileSnap.exists()) {
            setUserProfile(profileSnap.data());
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      setSending(true);
      await addDoc(collection(db, "feedback"), {
        userId: user.uid,
        username: userProfile?.username || "Unknown",
        message: message.trim(),
        createdAt: Timestamp.now(),
      });
      setSent(true);
      setMessage("");
      addToast("Copy, message received.", "success");
    } catch (err) {
      console.error("Error sending feedback:", err);
      addToast("Lost comms. Try again.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card">
      <h1 className="card-title">Radio Message</h1>

      {sent ? (
        <div className="question-container" style={{ textAlign: "center" }}>
          <p className="text-secondary" style={{ marginBottom: "16px" }}>
            Transmission received. We'll review your message.
          </p>
          <button className="btn btn-secondary" onClick={() => setSent(false)}>
            Send Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-secondary" style={{ marginBottom: "16px" }}>
            Bug report, feature idea, or just want to say something? We're listening.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message to the pit wall..."
            rows={5}
            style={{ resize: "vertical", marginBottom: "16px" }}
          />
          <button
            type="submit"
            className="btn btn-block"
            disabled={!message.trim() || sending}
          >
            {sending ? "Transmitting..." : "Send Message"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Feedback;
