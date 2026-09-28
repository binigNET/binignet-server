# bnetd (mysql) with config baked in; no host files needed.
# Base built from src/pvpgn-server/bnetd/Dockerfile (amd64 only).
FROM ender25/pvpgn-server:bnetd-mysql@sha256:2cd03632f8cb9638fda2f0fcdc665ecfb224a3e571113fc9e13aba360fc1f975

# overrides: any file here replaces the image default
COPY conf/ /usr/local/etc/pvpgn/

# pristine copies, rendered into /usr/local/etc/pvpgn on every start
RUN mkdir -p /usr/local/share/pvpgn/templates && \
    cp /usr/local/etc/pvpgn/bnetd.conf \
       /usr/local/etc/pvpgn/address_translation.conf \
       /usr/local/share/pvpgn/templates/

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 6112 6112/udp 6200 6200/udp 4000 4000/udp

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
