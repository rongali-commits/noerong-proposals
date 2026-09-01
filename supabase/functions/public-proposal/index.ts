import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  // In preview, echo the requesting origin. After publishing, set ALLOWED_ORIGIN
  // env var to restrict to the production domain (e.g. https://yourapp.bolt.host).
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN");
  const corsOrigin = allowedOrigin
    ? (origin === allowedOrigin ? origin : "null")
    : (origin || "*");
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };
}

type SafeComment = {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
};

type PublicProposalData = {
  business: {
    name: string;
    logo_url: string;
    brand_color: string;
    contact_email: string;
    contact_phone: string;
    address: string;
  };
  client: { name: string; company: string } | null;
  proposal: {
    proposal_number: string;
    title: string;
    status: string;
    currency: string;
    subtotal: number;
    discount_amount: number;
    tax_rate: number;
    total: number;
    notes: string;
    terms: string;
    expiry_date: string | null;
    sent_at: string | null;
    viewed_at: string | null;
    accepted_at: string | null;
    rejected_at: string | null;
    created_at: string;
  };
  items: Array<{
    description: string;
    detail: string;
    quantity: number;
    rate: number;
    discount: number;
    sort_order: number;
  }>;
  comments: SafeComment[];
};

function jsonResponse(body: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, corsHeaders: Record<string, string>, status: number): Response {
  return jsonResponse({ error: message }, corsHeaders, status);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse("Server configuration error", corsHeaders, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // Route: /public-proposal/proposal/:token
  // pathParts from Deno: ["public-proposal", "proposal", ":token"] or ["proposal", ":token"]
  // We match the last two segments
  let token: string | undefined;
  if (pathParts.length >= 2) {
    token = pathParts[pathParts.length - 1];
  }

  if (!token || !isUuid(token)) {
    return errorResponse("Invalid link", corsHeaders, 404);
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .rpc("get_public_proposal", { p_token: token });

      if (error) {
        return errorResponse("Invalid link", corsHeaders, 404);
      }

      if (!data) {
        return errorResponse("Invalid link", corsHeaders, 404);
      }

      return jsonResponse(data as PublicProposalData, corsHeaders);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const action = body.action;

      if (action === "comment") {
        const authorName = typeof body.author_name === "string" ? body.author_name : "";
        const commentBody = typeof body.body === "string" ? body.body : "";

        if (!authorName.trim() || authorName.trim().length > 200) {
          return errorResponse("Author name must be between 1 and 200 characters", corsHeaders, 400);
        }
        if (!commentBody.trim() || commentBody.trim().length > 1000) {
          return errorResponse("Comment must be between 1 and 1000 characters", corsHeaders, 400);
        }

        const { data, error } = await supabase
          .rpc("add_public_comment", {
            p_token: token,
            p_author_name: authorName,
            p_body: commentBody,
          });

        if (error) {
          return errorResponse("Could not add comment", corsHeaders, 400);
        }

        return jsonResponse(data as SafeComment, corsHeaders);
      }

      if (action === "accept") {
        const clientName = typeof body.client_name === "string" ? body.client_name : "";
        const authorized = body.authorized === true;

        if (!clientName.trim() || clientName.trim().length > 200) {
          return errorResponse("Your full name is required", corsHeaders, 400);
        }
        if (!authorized) {
          return errorResponse("You must confirm you are authorized to approve this proposal", corsHeaders, 400);
        }

        const { data, error } = await supabase
          .rpc("accept_proposal", {
            p_token: token,
            p_client_name: clientName,
            p_authorized: authorized,
          });

        if (error) {
          return errorResponse("Could not accept proposal", corsHeaders, 400);
        }

        return jsonResponse(data, corsHeaders);
      }

      if (action === "decline") {
        const clientName = typeof body.client_name === "string" ? body.client_name : "";
        const reason = typeof body.reason === "string" ? body.reason : "";

        if (!clientName.trim() || clientName.trim().length > 200) {
          return errorResponse("Your full name is required", corsHeaders, 400);
        }
        if (reason.length > 1000) {
          return errorResponse("Reason must be 1000 characters or fewer", corsHeaders, 400);
        }

        const { data, error } = await supabase
          .rpc("decline_proposal", {
            p_token: token,
            p_client_name: clientName,
            p_reason: reason,
          });

        if (error) {
          return errorResponse("Could not decline proposal", corsHeaders, 400);
        }

        return jsonResponse(data, corsHeaders);
      }

      return errorResponse("Unknown action", corsHeaders, 400);
    }

    return errorResponse("Method not allowed", corsHeaders, 405);
  } catch {
    return errorResponse("Something went wrong", corsHeaders, 500);
  }
});
