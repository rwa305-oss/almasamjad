/** Server-only integration template. npm install stripe
 * Mount createCheckout at POST /api/checkout on a secure backend.
 * Supply server environment variables; never bundle this file in dist.
 */
import Stripe from 'stripe';
const catalogue={ 'sage-noir':18500,'rose-dusk':21000,'oud-heritage':24500,'ivory-fabric':14500,'sage-fabric':15500,'charcoal-set':29500 };
export async function createCheckout(request, env){
  if(!env.STRIPE_SECRET_KEY||!env.PUBLIC_ORIGIN) return Response.json({error:'Payments are not configured'},{status:503});
  try{
    const {items,shipping,promo,customer}=await request.json();
    if(!Array.isArray(items)||!items.length||items.length>30||!['standard','express'].includes(shipping)||!customer||typeof customer.email!=='string'||!/^\S+@\S+\.\S+$/.test(customer.email)||!['','WELCOME10'].includes(promo||'')) throw Error('Invalid order');
    const keys=new Set();
    for(const item of items){
      const key=item.id+':'+item.size;
      if(keys.has(key)||!catalogue[item.id]||!Number.isInteger(item.qty)||item.qty<1||item.qty>20||(item.id==='charcoal-set'?!['S','M','L','XL'].includes(item.size):item.size!==''))throw Error('Invalid item');
      keys.add(key);
    }
    const stripe=new Stripe(env.STRIPE_SECRET_KEY);
    const subtotal=items.reduce((sum,x)=>sum+catalogue[x.id]*x.qty,0);
    const eligibleSubtotal=promo==='WELCOME10'?Math.round(subtotal*.9):subtotal;
    const delivery=shipping==='express'?3500:eligibleSubtotal>=35000?0:2000;
    if(promo==='WELCOME10'&&!env.STRIPE_WELCOME_COUPON_ID) return Response.json({error:'Promotion unavailable'},{status:503});
    const session=await stripe.checkout.sessions.create({mode:'payment',customer_email:customer.email,
      line_items:items.map(item=>({price_data:{currency:'aed',unit_amount:catalogue[item.id],product_data:{name:item.id.replaceAll('-',' ')+(item.size?' / '+item.size:'')}},quantity:item.qty})),
      ...(promo==='WELCOME10'?{discounts:[{coupon:env.STRIPE_WELCOME_COUPON_ID}]}:{}),
      shipping_address_collection:{allowed_countries:['AE']},phone_number_collection:{enabled:true},
      shipping_options:[{shipping_rate_data:{type:'fixed_amount',fixed_amount:{amount:delivery,currency:'aed'},display_name:shipping==='express'?'Express UAE':'Standard UAE'}}],
      success_url:env.PUBLIC_ORIGIN+'/?session_id={CHECKOUT_SESSION_ID}#confirmation',cancel_url:env.PUBLIC_ORIGIN+'/#checkout',
      metadata:{brand:'Almas Amjad',shipping}
    });
    return Response.json({url:session.url});
  }catch{return Response.json({error:'Unable to create checkout'},{status:400})}
}
/** Mount at POST /api/stripe-webhook with untouched raw request body.
 * handlePaidOrder MUST persist session.id with a unique constraint and durably
 * queue fulfillment/email in one transaction. Repeated deliveries must be no-ops.
 */
export async function stripeWebhook(request,env,handlePaidOrder){
  const stripe=new Stripe(env.STRIPE_SECRET_KEY);let event;
  try{event=stripe.webhooks.constructEvent(await request.text(),request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET)}catch{return new Response('Invalid signature',{status:400})}
  if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&event.data.object.payment_status==='paid'){
    if(typeof handlePaidOrder!=='function')return new Response('Order persistence not configured',{status:503});
    await handlePaidOrder(event.data.object,{notificationRecipient:'waqasamjadrana@outlook.com'});
  }
  return new Response('ok');
}
