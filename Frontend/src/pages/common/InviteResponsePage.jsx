import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../lib/axios";

const InviteResponsePage = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {

        const respond = async () => {
            try {

                const token = params.get("token");
                const action = params.get("action");

                const res = await axiosInstance.post(
                    `/student/invite/respond-token`,
                    {
                        token,
                        action,
                    }
                );

                alert(res.data.message);

                navigate("/login");

            } catch (err) {

                alert(
                    err.response?.data?.message ||
                    "Invalid or expired invitation"
                );

                navigate("/login");
            }
        };

        respond();

    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            Processing invitation...
        </div>
    );
};

export default InviteResponsePage;