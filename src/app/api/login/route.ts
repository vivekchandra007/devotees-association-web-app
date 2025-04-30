import axios from "axios";

export async function POST(request: Request) {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifiedPhoneAccesstoken = authHeader.split(' ')[1];

    try {
        const response = await axios.post(process.env.MSG91_SERVER_VERIFY_URL!, {
            "authkey": process.env.MSG91_SERVER_AUTH_KEY,
            "access-token": verifiedPhoneAccesstoken
        }, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        });

        if (response.status === 200) {
            return Response.json(response.data, { status: 200 });
        } else {
            console.log("Error verifying MSG91 access token", response.data);
            return Response.json({ error: "Error verifying MSG91 access token" }, { status: 401 });
        }
    } catch (error) {
        console.log("Error verifying MSG91 access token", error)
        return Response.json({ error: "Error verifying MSG91 access token" }, { status: 401 });
    }
}
