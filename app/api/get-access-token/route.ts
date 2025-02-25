import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Extrai a chave de API do corpo da requisição
    const { apiKey } = await request.json();

    if (!apiKey) {
      throw new Error("API key is missing in the request body");
    }

    // Usa a chave de API fornecida no corpo da requisição
    const res = await fetch(
      "https://api.heygen.com/v1/streaming.create_token",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey, // Usa a chave de API do corpo da requisição
        },
      },
    );

    const data = await res.json();

    return NextResponse.json({ token: data.data.token }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving access token:", error);

    return NextResponse.json(
      { error: "Failed to retrieve access token" },
      { status: 500 },
    );
  }
}