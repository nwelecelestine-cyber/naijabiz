import { createClient } from "@/src/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("LOGOUT ERROR:", error);

      return Response.json(
        {
          success: false,
          error: "Could not log out.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return Response.json(
      {
        success: false,
        error: "Could not log out.",
      },
      { status: 500 }
    );
  }
}