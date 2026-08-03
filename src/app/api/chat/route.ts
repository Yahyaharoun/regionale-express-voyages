import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { processLocalAIQuery } from '@/features/ai/aiRouter';

// Autorise jusqu'à 30 secondes d'exécution
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();
    const userMsg = messages[messages.length - 1].content;
    
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ text: "⚠️ Vous devez être connecté pour utiliser l'IA." }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Moteur d'intention NLP Local (Function Calling manuel)
    const { text, functionsCalled } = await processLocalAIQuery(userMsg, user, context);

    // Historisation Audit
    await prisma.aILog.create({
      data: {
        userId: user.userId,
        role: user.role,
        question: userMsg,
        functionsCalled: functionsCalled
      }
    });

    // Réponse
    return new Response(JSON.stringify({ text, functionsCalled }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("AI Route Error:", error);
    return new Response(JSON.stringify({ text: "Erreur interne de l'assistant." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
