import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function AdminVideos() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });
    
    setLoading(false);
    if (error) toast({ title: "Failed to fetch jobs", description: error.message });
    else setJobs(data || []);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const approveJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ is_approved: true }).eq("job_id", jobId);
    if (error) toast({ title: "Failed to approve", description: error.message });
    else {
      toast({ title: "Job Approved!" });
      setJobs(jobs.filter(j => j.job_id !== jobId));
    }
  };

  const rejectJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ status: "REJECTED" }).eq("job_id", jobId);
    if (error) toast({ title: "Failed to reject", description: error.message });
    else {
      toast({ title: "Job Rejected" });
      setJobs(jobs.filter(j => j.job_id !== jobId));
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Pending Video Approvals</h1>
          <p className="text-muted-foreground mt-1">Review user jobs containing video uploads before they appear on the vendor feed.</p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : jobs.length === 0 ? (
          <Card className="p-10 text-center"><p className="text-muted-foreground">No pending video jobs to review.</p></Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.job_id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Job: {job.category_id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">{job.description}</div>
                  
                  {job.media_urls && job.media_urls.filter((url: string) => url.includes('.mp4') || url.includes('.mov') || url.includes('.webm')).map((url: string, i: number) => (
                    <video key={i} src={url} controls className="w-full h-48 bg-black rounded-lg object-contain" />
                  ))}
                  
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => approveJob(job.job_id)}>Approve</Button>
                    <Button variant="destructive" className="flex-1" onClick={() => rejectJob(job.job_id)}>Reject</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
