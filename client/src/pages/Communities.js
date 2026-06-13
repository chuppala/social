import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import api from "../utils/api";

export default function Communities() {

  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    api.get("/communities")
      .then(res =>
        setCommunities(
          res.data.communities || []
        )
      );
  }, []);

  return (
    <>
      <Navbar />

      <div
        style={{
          maxWidth:"1000px",
          margin:"30px auto",
          padding:"20px"
        }}
      >
        <h1>
          All Communities
        </h1>

        <div
          style={{
            display:"grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(250px,1fr))",
            gap:"16px",
            marginTop:"20px"
          }}
        >
          {communities.map(c => (
            <Link
              key={c._id}
              to={`/c/${c.name}`}
              style={{
                textDecoration:"none",
                background:"#fff",
                padding:"18px",
                borderRadius:"16px",
                boxShadow:
                  "0 4px 20px rgba(0,0,0,.06)"
              }}
            >
              <h3
                style={{
                  color:c.color,
                  marginBottom:"8px"
                }}
              >
                c/{c.name}
              </h3>

              <p
                style={{
                  color:"#6b7280",
                  fontSize:"14px"
                }}
              >
                {c.description}
              </p>

              <div
                style={{
                  marginTop:"10px",
                  fontSize:"12px",
                  color:"#9ca3af"
                }}
              >
                {c.memberCount || 0} members
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}