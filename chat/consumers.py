from channels.generic.websocket import AsyncJsonWebsocketConsumer

from typing import Union, TypedDict, Literal


class ChatRequest(TypedDict):
    type: Literal["chat"]
    message: str


class RTCRequest(TypedDict):
    type: Literal["sdp"]
    sdp: dict[str, str]


class ICERequest(TypedDict):
    type: Literal["ice-candidate"]
    candidate: dict


SocRequest = Union[ChatRequest, RTCRequest, ICERequest]


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.user_id = self.scope["url_route"]["kwargs"]["user_id"]
        self.room_group_name = f"chat_{self.room_name}"

        if not self.user_id:
            await self.close()

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content: SocRequest):
        req_type = content.get('type')

        if req_type == "chat":
            message = content.get("message")
            message = message.strip() if message else None
            if message:
                # Broadcast the chat message
                await self.channel_layer.group_send(
                    self.room_group_name, {
                        "type": "chat.message", "message": message}
                )
            return

        if req_type == "sdp":
            sdp = content.get("sdp")
            sender = content.get("sender")
            receiver = content.get("receiver")

            if not (sdp and sender):
                return

            if sdp['type'] == "offer":
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "sdp.offer", "sdp": sdp,
                     "sender": self.user_id
                     }
                )
            else:
                if not receiver:
                    return
                # Send SDP answer directly to the receiver
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "sdp.answer", "sdp": sdp,
                        "sender": self.user_id, "receiver": receiver}
                )

        if req_type == "ice-candidate":
            candidate = content.get("candidate")
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "ice.candidate", "candidate": candidate,
                    "sender": self.user_id, }
            )

    async def chat_message(self, event):
        message = event.get('message')
        await self.send_json({'message': message})

    async def sdp_offer(self, event):
        """
        Broadcast an sdp offer to everyone but sender in the group
        """
        if self.user_id != event['sender']:
            await self.send_json({'sdp': event.get("sdp"),
                                  "sender": event.get('sender'), 'receiver': self.user_id})

    async def sdp_answer(self, event):
        if event.get("receiver") == self.user_id:  # Only send to the intended receiver
            await self.send_json({'sdp': event.get("sdp"), "sender": event.get("sender")})

    async def ice_candidate(self, event):
        if event.get("sender") != self.user_id:
            await self.send_json({'candidate': event.get('candidate')})
