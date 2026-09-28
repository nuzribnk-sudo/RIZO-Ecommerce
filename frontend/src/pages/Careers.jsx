import { useEffect } from "react";

import Navbar from "../components/Navbar";

import Footer from "../components/Footer";

import { toast } from "react-hot-toast";

import "./Careers.css";

function Careers() {
  const jobs = [
    {
      id: 1,
      title: "Fashion Sales Associate",
      department: "Retail",
      location: "Kerala, India",
      type: "Full Time",
    },
    {
      id: 2,
      title: "Social Media Executive",
      department: "Marketing",
      location: "Remote",
      type: "Full Time",
    },
    {
      id: 3,
      title: "Fashion Designer",
      department: "Design",
      location: "Kerala, India",
      type: "Full Time",
    },
  ];

  // Scroll to top when page opens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleApply = (jobTitle) => {
    toast.success(
      `Application for ${jobTitle} will be available soon!`,
      {
        duration: 2000,
        position: "top-center",
      }
    );
  };

  return (
    <>
      <Navbar />

      <main className="careers-page">
        {/* HERO */}
        <section className="careers-heading">
          <p>JOIN RIZO</p>

          <h1>CAREERS</h1>

          <span>
            Join our team and help us shape the future of fashion.
          </span>
        </section>

        {/* ABOUT */}
        <section className="careers-intro">
          <h2>WORK WITH US</h2>

          <p>
            At RIZO, we believe fashion is more than clothing. We are
            building a creative team that is passionate about style,
            innovation and creating great experiences for our customers.
          </p>
        </section>

        {/* BENEFITS */}
        <section className="career-benefits">
          <div className="benefit-card">
            <span>✦</span>

            <h3>Creative Environment</h3>

            <p>
              Work with passionate people who love fashion and creativity.
            </p>
          </div>

          <div className="benefit-card">
            <span>✦</span>

            <h3>Career Growth</h3>

            <p>
              Learn new skills and grow your career with our team.
            </p>
          </div>

          <div className="benefit-card">
            <span>✦</span>

            <h3>Great Team</h3>

            <p>
              Be part of a supportive and friendly working environment.
            </p>
          </div>
        </section>

        {/* JOB OPENINGS */}
        <section className="jobs-section">
          <div className="jobs-heading">
            <p>OPPORTUNITIES</p>

            <h2>OPEN POSITIONS</h2>
          </div>

          <div className="jobs-container">
            {jobs.map((job) => (
              <article
                className="job-card"
                key={job.id}
              >
                <div className="job-info">
                  <h3>{job.title}</h3>

                  <div className="job-details">
                    <span>{job.department}</span>

                    <span>{job.location}</span>

                    <span>{job.type}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="apply-btn"
                  onClick={() => handleApply(job.title)}
                >
                  APPLY NOW
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section className="careers-contact">
          <h2>DON'T SEE THE RIGHT ROLE?</h2>

          <p>
            Send us your resume and we will contact you when a suitable
            opportunity becomes available.
          </p>

          <a
            href="mailto:careers@rizo.com"
            className="career-email-btn"
          >
            SEND YOUR RESUME
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Careers;